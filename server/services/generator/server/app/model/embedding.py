import os
import numpy as np
import torch
import matplotlib.pyplot as plt

from .triplet_loss import TripletLoss
from .causal_cnn import CausalCNNModule


class Dataset(torch.utils.data.Dataset):
    """
    PyTorch wrapper for a numpy dataset.

    @param dataset Numpy array representing the dataset.
    """

    def __init__(self, dataset):
        self.dataset = dataset

    def __len__(self):
        return np.shape(self.dataset)[0]

    def __getitem__(self, index):
        return self.dataset[index]


class TimeSeriesEncoder():
    """
    "Virtual" class to wrap an encoder of time series as a PyTorch module and
    a SVM classifier with RBF kernel on top of its computed representations in
    a scikit-learn class.

    All inheriting classes should implement the get_params and set_params
    methods, as in the recommendations of scikit-learn.

    @param compared_length Maximum length of randomly chosen time series. If
           None, this parameter is ignored.
    @param nb_random_samples Number of randomly chosen intervals to select the
           final negative sample in the loss.
    @param negative_penalty Multiplicative coefficient for the negative sample
           loss.
    @param batch_size Batch size used during the training of the encoder.
    @param nb_steps Number of optimization steps to perform for the training of
           the encoder.
    @param lr learning rate of the Adam optimizer used to train the encoder.
    @param encoder Encoder PyTorch module.
    @param params Dictionaries of the parameters of the encoder.
    @param in_channels Number of input channels of the time series.
    @param cuda Transfers, if True, all computations to the GPU.
    @param gpu GPU index to use, if CUDA is enabled.
    """

    def __init__(self,
                 compared_length,
                 nb_random_samples,
                 negative_penalty,
                 batch_size,
                 nb_steps,
                 lr,
                 encoder,
                 params,
                 in_channels,
                 out_channels,
                 cuda=False,
                 gpu=0):
        self.architecture = ''
        self.cuda = cuda
        self.gpu = gpu
        self.batch_size = batch_size
        self.nb_steps = nb_steps
        self.lr = lr
        self.encoder = encoder
        self.params = params
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.loss = TripletLoss(compared_length, nb_random_samples, negative_penalty)
        self.optimizer = torch.optim.Adam(self.encoder.parameters(), lr=lr)
        self.losses = []

    def save_encoder(self, prefix_folder):
        """
        Saves the encoder

        """
        torch.save(self.encoder.state_dict(), os.path.join(prefix_folder, self.architecture + '_encoder.pth'))

    def load_encoder(self, prefix_folder):
        """
        Loads an encoder.

        """
        if self.cuda:
            self.encoder.load_state_dict(
                torch.load(os.path.join(prefix_folder, self.architecture + '_encoder.pth'),
                           map_location=lambda storage, loc: storage.cuda(self.gpu)))
        else:
            self.encoder.load_state_dict(
                torch.load(os.path.join(prefix_folder, self.architecture + '_encoder.pth'),
                           map_location=lambda storage, loc: storage))
        self.encoder = self.encoder.eval()

    def fit_encoder(self, X):
        """
        Trains the encoder unsupervisedly using the given training data.

        @param X Training set.
        @param y Training labels, used only for early stopping, if enabled. If
               None, disables early stopping in the method.
        @param save_memory If True, enables to save GPU memory by propagating
               gradients after each loss term of the encoder loss, instead of
               doing it after computing the whole loss.
        @param verbose Enables, if True, to monitor which epoch is running in
               the encoder training.
        """

        train_dataset = []
        train_torch_dataset = []

        for x in X:
            train = torch.from_numpy(x)
            if self.cuda:
                train = train.cuda(self.gpu)

            train_dataset.append(train)
            train_torch_dataset.append(Dataset(x))

        i = 0  # Number of performed optimization steps
        epochs = 0  # Number of performed epochs
        index = list(range(len(train_dataset)))

        # Encoder training
        while i < self.nb_steps:
            print('Epoch: {}'.format(epochs))
            np.random.shuffle(index)
            for j in index:
                train_generator = torch.utils.data.DataLoader(train_torch_dataset[j], batch_size=self.batch_size, shuffle=True)
                for batch in train_generator:
                    if self.cuda:
                        batch = batch.cuda(self.gpu)
                    self.optimizer.zero_grad()
                    loss = self.loss(batch, self.encoder, train_dataset[j])
                    self.losses.append(loss.item())
                    loss.backward()
                    self.optimizer.step()
                    i += 1
                    if i >= self.nb_steps:
                        break
                if i >= self.nb_steps:
                    break
            print(self.losses[-1])
            epochs += 1

        return self.encoder

    def encode(self, X):
        """
        Outputs the representations associated to the input by the encoder.

        @param X Testing set.
        """
        with torch.no_grad():
            if self.cuda:
                X = X.cuda(self.gpu)
            features = self.encoder(X).cpu()

        return features

    def plot(self, prefix_folder='.'):
        plt.plot(list(range(len(self.losses))), self.losses)
        plt.savefig(os.path.join(prefix_folder, 'embedding_loss.jpg'))


class CausalCNNEncoder(TimeSeriesEncoder):
    """
    Wraps a causal CNN encoder of time series as a PyTorch module 
    on top of its computed representations in a scikit-learn class.

    @param compared_length Maximum length of randomly chosen time series. If
           None, this parameter is ignored.
    @param nb_random_samples Number of randomly chosen intervals to select the
           final negative sample in the loss.
    @param negative_penalty Multiplicative coefficient for the negative sample
           loss.
    @param batch_size Batch size used during the training of the encoder.
    @param nb_steps Number of optimization steps to perform for the training of
           the encoder.
    @param lr learning rate of the Adam optimizer used to train the encoder.
    @param channels Number of channels manipulated in the causal CNN.
    @param depth Depth of the causal CNN.
    @param reduced_size Fixed length to which the output time series of the
           causal CNN is reduced.
    @param out_channels Number of features in the final output.
    @param kernel_size Kernel size of the applied non-residual convolutions.
    @param in_channels Number of input channels of the time series.
    @param cuda Transfers, if True, all computations to the GPU.
    @param gpu GPU index to use, if CUDA is enabled.
    """

    def __init__(self,
                 compared_length=None,
                 nb_random_samples=10,
                 negative_penalty=1,
                 batch_size=32,
                 nb_steps=2000,
                 lr=0.001,
                 channels=10,
                 depth=1,
                 reduced_size=10,
                 out_channels=10,
                 kernel_size=4,
                 in_channels=1,
                 cuda=False,
                 gpu=0):
        super(CausalCNNEncoder, self).__init__(
            compared_length, nb_random_samples, negative_penalty, batch_size, nb_steps, lr,
            self.__create_encoder(in_channels, channels, depth, reduced_size, out_channels, kernel_size, cuda, gpu),
            self.__encoder_params(in_channels, channels, depth, reduced_size, out_channels, kernel_size), in_channels,
            out_channels, cuda, gpu)
        self.architecture = 'CausalCNN'
        self.channels = channels
        self.depth = depth
        self.reduced_size = reduced_size
        self.kernel_size = kernel_size

    def __create_encoder(self, in_channels, channels, depth, reduced_size, out_channels, kernel_size, cuda, gpu):
        encoder = CausalCNNModule(in_channels, channels, depth, reduced_size, out_channels, kernel_size)
        encoder.double()
        if cuda:
            encoder.cuda(gpu)
        return encoder

    def __encoder_params(self, in_channels, channels, depth, reduced_size, out_channels, kernel_size):
        return {
            'in_channels': in_channels,
            'channels': channels,
            'depth': depth,
            'reduced_size': reduced_size,
            'out_channels': out_channels,
            'kernel_size': kernel_size
        }

    def encode_sequence(self, X, batch_size=50):
        """
        Outputs the representations associated to the input by the encoder,
        from the start of the time series to each time step (i.e., the
        evolution of the representations of the input time series with
        repect to time steps).

        Takes advantage of the causal CNN (before the max pooling), wich
        ensures that its output at time step i only depends on time step i and
        previous time steps.

        @param X Testing set.
        @param batch_size Size of batches used for splitting the test data to
               avoid out of memory errors when using CUDA. Ignored if the
               testing set contains time series of unequal lengths.
        """
        # Check if the given time series have unequal lengths
        varying = bool(np.isnan(np.sum(X)))

        test = Dataset(X)
        test_generator = torch.utils.data.DataLoader(test, batch_size=batch_size if not varying else 1)
        length = np.shape(X)[2]
        features = np.full((np.shape(X)[0], self.out_channels, length), np.nan)
        self.encoder = self.encoder.eval()

        causal_cnn = self.encoder.network[0]
        linear = self.encoder.network[3]

        count = 0
        with torch.no_grad():
            if not varying:
                for batch in test_generator:
                    if self.cuda:
                        batch = batch.cuda(self.gpu)
                    # First applies the causal CNN
                    output_causal_cnn = causal_cnn(batch)
                    after_pool = torch.empty(output_causal_cnn.size(), dtype=torch.double)
                    if self.cuda:
                        after_pool = after_pool.cuda(self.gpu)
                    after_pool[:, :, 0] = output_causal_cnn[:, :, 0]
                    # Then for each time step, computes the output of the max
                    # pooling layer
                    for i in range(1, length):
                        after_pool[:, :, i] = torch.max(torch.cat([after_pool[:, :, i - 1:i], output_causal_cnn[:, :, i:i + 1]],
                                                                  dim=2),
                                                        dim=2)[0]
                    features[count * batch_size:(count + 1) * batch_size, :, :] = torch.transpose(
                        linear(torch.transpose(after_pool, 1, 2)), 1, 2)
                    count += 1
            else:
                for batch in test_generator:
                    if self.cuda:
                        batch = batch.cuda(self.gpu)
                    length = batch.size(2) - torch.sum(torch.isnan(batch[0, 0])).data.cpu().numpy()
                    output_causal_cnn = causal_cnn(batch)
                    after_pool = torch.empty(output_causal_cnn.size(), dtype=torch.double)
                    if self.cuda:
                        after_pool = after_pool.cuda(self.gpu)
                    after_pool[:, :, 0] = output_causal_cnn[:, :, 0]
                    for i in range(1, length):
                        after_pool[:, :, i] = torch.max(torch.cat([after_pool[:, :, i - 1:i], output_causal_cnn[:, :, i:i + 1]],
                                                                  dim=2),
                                                        dim=2)[0]
                    features[count:count + 1, :, :] = torch.transpose(linear(torch.transpose(after_pool, 1, 2)), 1, 2)
                    count += 1

        self.encoder = self.encoder.train()
        return features

    def get_params(self):
        return {
            'compared_length': self.loss.compared_length,
            'nb_random_samples': self.loss.nb_random_samples,
            'negative_penalty': self.loss.negative_penalty,
            'batch_size': self.batch_size,
            'nb_steps': self.nb_steps,
            'lr': self.lr,
            'channels': self.channels,
            'depth': self.depth,
            'reduced_size': self.reduced_size,
            'kernel_size': self.kernel_size,
            'in_channels': self.in_channels,
            'out_channels': self.out_channels,
            'cuda': self.cuda,
            'gpu': self.gpu
        }

    def set_params(self, compared_length, nb_random_samples, negative_penalty, batch_size, nb_steps, lr, channels, depth,
                   reduced_size, out_channels, kernel_size, in_channels, cuda, gpu):
        self.__init__(compared_length, nb_random_samples, negative_penalty, batch_size, nb_steps, lr, channels, depth,
                      reduced_size, out_channels, kernel_size, in_channels, cuda, gpu)
        return self

    def eval(self):
        self.encoder.eval()
