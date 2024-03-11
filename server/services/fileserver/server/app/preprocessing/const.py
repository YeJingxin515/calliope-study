import enum

TIME_FORMAT = ['%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d %H:%M:%S', '%Y/%m/%d', '%Y-%m', '%Y-%m-%d']


class PandasTimeLabel(enum.Enum):
    Millisecond = 'L'
    Second = 'S'
    Minute = 'T'
    Hour = 'H'
    Day = 'D'
    Month = 'M'
    Year = 'A'
