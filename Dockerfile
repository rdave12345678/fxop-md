FROM quay.io/astrofx011/fx-patch:latest

# Update npm to the latest version globally
RUN npm install -g npm@latest

# Install system dependencies for canvas
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config

RUN git clone https://github.com/FXastro/fxop-md .

WORKDIR /fxop-md
RUN npm install
CMD ["npm", "start"]