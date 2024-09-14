FROM quay.io/astrofx011/fx-bot:latest
RUN git clone https://github.com/FXastro/fxop-md .
WORKDIR /fxop-md
RUN npm install
CMD ["npm", "start"]