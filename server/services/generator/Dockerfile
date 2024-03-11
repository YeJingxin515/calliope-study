FROM python:3.8.4-slim

RUN apt-get update
COPY requirements.txt /
RUN pip install -U pip
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
RUN pip config set install.trusted-host  pypi.tuna.tsinghua.edu.cn
RUN pip3 install -r /requirements.txt

COPY en_core_web_md-3.2.0.tar.gz /
RUN pip install ./en_core_web_md-3.2.0.tar.gz

COPY /server /server
WORKDIR /server