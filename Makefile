node:
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo apt-get install -y nodejs
	sudo apt-get install -y build-essential

update: package.json
	sudo npm install

server: index.js
	node index.js
