import numpy as np
from torch.utils.data import Dataset
from statsmodels import api as sm
from scipy.fftpack import fft, fftfreq
from scipy.signal import find_peaks, periodogram
from statsmodels.tsa.seasonal import STL

from app.common.const import PandasTimeLabel
from app.common.utils import detect_period

DEBUG = False


def check_seasonality(series, freq):
    period = detect_period(series, freq)
    if period > len(series) / 2:
        print('unseasonal')
        return -1
    return period


def segment_seasonal(series, period):
    return list(range(0, len(series), period))


def segment_unseasonal(series):
    peaks, _ = find_peaks(series, distance=100)
    peaks = peaks.tolist()
    if len(peaks) == 0:
        return [0]
    merged_peaks = [0]
    i = 0
    threshold = 10
    while i < len(peaks):
        if peaks[i] - merged_peaks[-1] > threshold:
            merged_peaks.append(peaks[i])
        i += 1
    return merged_peaks


def generate_segment_data(data, freq):
    metadata = {}
    for i, column in enumerate(data.columns):
        period = check_seasonality(data[column].values, freq)
        peaks = segment_seasonal(data[column].values, period) if period > 0 else segment_unseasonal(data[column].values)
        if peaks[-1] != len(data) - 1:
            peaks.append(len(data) - 1)
        metadata[column] = peaks

    return SegmentDataset(metadata=metadata)


class SegmentDataset(Dataset):

    def __init__(self, metadata=None):
        self.metadata = metadata
        self.segments = []
        for variable, indicies in self.metadata.items():
            for i in range(len(indicies) - 1):
                self.segments.append({'variables': variable, 'segment_idx': i})

    def __getitem__(self, index):
        return self.segments[index]

    def __len__(self):
        return len(self.segments)


class Segment:

    def __init__(self,
                 data=None,
                 metadata=None,
                 freq=None,
                 variable=None,
                 start=None,
                 end=None,
                 embedding=None,
                 variable_embeddings=None,
                 insight=None) -> None:
        self.data = data
        self.freq = freq
        self.metadata = metadata
        self.variable = variable
        self.start = start
        self.end = end
        self.embedding = embedding
        self.variable_embeddings = variable_embeddings
        self.insight = insight

    def get_data(self):
        return self.data.copy()

    def copy(self):
        """
        Return a copy of the segment without insight
        """
        return Segment(data=self.data,
                       metadata=self.metadata,
                       freq=self.freq,
                       variable=self.variable,
                       start=self.start,
                       end=self.end,
                       variable_embeddings=self.variable_embeddings)

    def __str__(self) -> str:
        return 'variable: {} start: {} end: {}'.format('|'.join(self.variable), self.start, self.end)
