const templates = [
    {
        'id': 0,
        'template': '{{action}}在{{subspace0}}到{{subspace1}} 之间，{{agg}}{{measure}}的数据分布如图所示. 其数据范围位于{{min}}到{{max}}区间内.',
    },
    {
        'id': 1,
        'template': '{{action}}在{{subspace0}}到{{subspace1}} 之间，{{agg}}{{measure}}的数据分布的结果如图所示. 其平均值为{{mean}}.',
    },
    {
        'id': 2,
        'template': '{{action}}在{{subspace0}}到{{subspace1}} 之间，{{agg}}{{measure}}随时间的分布如图所示. 其中最大值为{{max}}，最小值为{{min}}.',
    },
]

export default templates;