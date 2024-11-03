# Chọn image Node.js từ Docker Hub
FROM node:14

# Tạo thư mục làm việc trong container
WORKDIR /usr/src/app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Mở cổng mà ứng dụng sẽ lắng nghe
EXPOSE 3000

# Lệnh chạy ứng dụng
CMD ["npm", "start"]
