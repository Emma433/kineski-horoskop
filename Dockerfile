# Koristimo službeni Node.js image (verzija 20)
FROM node:20

# Postavi radni direktorij unutar containera
WORKDIR /app

# Kopiraj package.json i package-lock.json
COPY package*.json ./

# Instaliraj ovisnosti
RUN npm install

# Kopiraj sve ostale datoteke
COPY . .

# Otvorimo port 3000
EXPOSE 3000

# Pokreni aplikaciju
CMD ["node", "app.js"]
