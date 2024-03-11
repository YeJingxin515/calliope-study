FROM python:3.7.4-slim

RUN apt-get update
RUN apt-get install libquadmath0
RUN apt-get install -y libgomp1 
COPY requirements.txt /
RUN pip install -U pip
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
RUN pip config set install.trusted-host  pypi.tuna.tsinghua.edu.cn
RUN pip3 install -r /requirements.txt

COPY /server /server
WORKDIR /server
