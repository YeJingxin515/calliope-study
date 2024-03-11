import os, time
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim

from torch.distributions import Categorical
from torch.utils.data.sampler import BatchSampler, SubsetRandomSampler
from ..common.const import ActionType

gamma = 0.99

# These pairs of action are opposite, so agent cannot select them continually
EXCLUSIVE_ACTION = {1: [2], 2: [1], 5: [6], 6: [5]}


class Actor(nn.Module):

    def __init__(self):
        super(Actor, self).__init__()
        self.action_head = nn.Sequential(nn.Linear(813, 512), nn.ReLU(), nn.Linear(512, 256), nn.ReLU(), nn.Linear(256, 32),
                                         nn.ReLU(), nn.Linear(32, 8))

    def forward(self, x):
        action_prob = F.softmax(self.action_head(x), dim=1)
        return action_prob


class Critic(nn.Module):

    def __init__(self):
        super(Critic, self).__init__()
        self.state_value = nn.Sequential(nn.Linear(813, 512), nn.ReLU(), nn.Linear(512, 256), nn.ReLU(), nn.Linear(256, 32),
                                         nn.ReLU(), nn.Linear(32, 1))

    def forward(self, x):
        value = self.state_value(x)
        return value


class PPO:

    def __init__(self, clip_param=0.2, max_grad_norm=0.5, ppo_update_time=10, buffer_capacity=3000, batch_size=64, cuda=False):
        super(PPO, self).__init__()
        self.actor_net = Actor()
        self.critic_net = Critic()

        self.buffer = []
        self.counter = 0
        self.training_step = 0

        self.clip_param = clip_param
        self.max_grad_norm = max_grad_norm
        self.ppo_update_time = ppo_update_time
        self.buffer_capacity = buffer_capacity
        self.batch_size = batch_size
        self.cuda = cuda
        if self.cuda:
            self.actor_net = self.actor_net.cuda()
            self.critic_net = self.critic_net.cuda()

        self.actor_optimizer = optim.Adam(self.actor_net.parameters(), 1e-5)
        self.critic_net_optimizer = optim.Adam(self.critic_net.parameters(), 3e-5)

    def select_action(self, state, segment_context, pre_action, can_end=False):
        mask = torch.zeros(8, dtype=torch.bool)
        if self.cuda:
            mask = mask.cuda()
        for invalid_action in EXCLUSIVE_ACTION.get(pre_action, []):
            mask[invalid_action] = True
        for i, segment in enumerate(segment_context['segments']):
            if segment is None:
                mask[i] = True
        if len(segment_context['segments'][0][0]) > 1:
            mask[ActionType.Expand.value] = True
        else:
            mask[ActionType.Narrow.value] = True
        if not can_end:
            mask[ActionType.EOS.value] = True

        state = torch.from_numpy(state).float().unsqueeze(0)
        if self.cuda:
            state = state.cuda()
        with torch.no_grad():
            torch.autograd.set_detect_anomaly(True)
            action_prob = self.actor_net(state) + 1e-8
            action_prob = action_prob.masked_fill(mask, 0)
        if torch.sum(action_prob) == 0 or torch.any(torch.isnan(action_prob)):
            return None, None
        c = Categorical(action_prob)
        action = c.sample()
        return action.item(), action_prob[:, action.item()].item(), action_prob

    def save_model(self, prefix_folder):
        torch.save(self.actor_net.state_dict(), os.path.join(prefix_folder, 'actor.pkl'))
        torch.save(self.critic_net.state_dict(), os.path.join(prefix_folder, 'critic.pkl'))

    def load_model(self, prefix_folder):
        self.actor_net.load_state_dict(torch.load(os.path.join(prefix_folder, 'actor.pkl')))
        self.critic_net.load_state_dict(torch.load(os.path.join(prefix_folder, 'critic.pkl')))

    def set_params(self,
                   clip_param=0.2,
                   max_grad_norm=0.5,
                   ppo_update_time=10,
                   buffer_capacity=3000,
                   batch_size=64,
                   cuda=False):
        self.__init__(clip_param=clip_param,
                      max_grad_norm=max_grad_norm,
                      ppo_update_time=ppo_update_time,
                      buffer_capacity=buffer_capacity,
                      batch_size=batch_size,
                      cuda=cuda)

    def store_transition(self, transition):
        self.buffer.append(transition)
        self.counter += 1

    def update(self, i_ep, Gt):
        state = torch.tensor([t.state for t in self.buffer], dtype=torch.float)
        action = torch.tensor([t.action for t in self.buffer], dtype=torch.long).view(-1, 1)
        old_action_log_prob = torch.tensor([t.a_log_prob for t in self.buffer], dtype=torch.float).view(-1, 1)

        if self.cuda:
            state = state.cuda()
            action = action.cuda()
            old_action_log_prob = old_action_log_prob.cuda()

        batch_actor_losses = []
        batch_critic_losses = []
        for i in range(self.ppo_update_time):
            for index in BatchSampler(SubsetRandomSampler(range(len(self.buffer))), self.batch_size, False):
                if self.training_step % 1000 == 0:
                    print('I_ep {} , train {} times'.format(i_ep, self.training_step))
                #with torch.no_grad():
                Gt_index = Gt[index].view(-1, 1)
                if self.cuda:
                    Gt_index = Gt_index.cuda()
                V = self.critic_net(state[index])
                delta = Gt_index - V
                advantage = delta.detach()
                # epoch iteration, PPO core!!!

                action_prob = self.actor_net(state[index]).gather(1, action[index])  # new policy

                ratio = (action_prob / old_action_log_prob[index])
                surr1 = ratio * advantage
                surr2 = torch.clamp(ratio, 1 - self.clip_param, 1 + self.clip_param) * advantage

                # update actor network
                action_loss = -torch.min(surr1, surr2).mean()  # MAX->MIN desent
                self.actor_optimizer.zero_grad()
                action_loss.backward()
                nn.utils.clip_grad_norm_(self.actor_net.parameters(), self.max_grad_norm)
                self.actor_optimizer.step()

                #update critic network
                value_loss = F.mse_loss(Gt_index, V)
                self.critic_net_optimizer.zero_grad()
                value_loss.backward()
                nn.utils.clip_grad_norm_(self.critic_net.parameters(), self.max_grad_norm)
                self.critic_net_optimizer.step()
                self.training_step += 1

                batch_actor_losses.append(action_loss.item())
                batch_critic_losses.append(value_loss.item())

        del self.buffer[:]  # clear experience

        return np.mean(batch_actor_losses), np.mean(batch_critic_losses)

    def eval(self):
        self.actor_net.eval()
        self.critic_net.eval()
