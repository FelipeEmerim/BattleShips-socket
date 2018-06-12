node:
	sudo apt-get install curl
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo apt-get install -y nodejs
	sudo apt-get install -y build-essential

update: package.json
	sudo npm install

server: index.js
	firefox localhost:3000/ & disown
	node index.js

clean:
	sudo apt-get remove nodejs
	sudo apt-get remove npm
