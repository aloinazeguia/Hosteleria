# 1) MySQL
brew services start mysql          # (si no está ya)

# 2) API  (terminal 1)
cd ~/Hosteleria/backend
npm start

# 3) Web  (terminal 2)
cd ~/Hosteleria
npx serve -l 5173 .