FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# --host is required so the Vite dev server accepts connections from
# outside the container, not just localhost inside it.
CMD ["npm", "run", "dev", "--", "--host"]
