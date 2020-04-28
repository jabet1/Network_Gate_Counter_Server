# Network Gate Counter - Server

Server to synchronise *[Network Gate Counter](https://play.google.com/store/apps/details?id=com.networkgatecounter)* Android Apps.


## Prerequisite

 - Node : [Installation](https://www.npmjs.com/get-npm)
 - Npm  : [Installation](https://www.npmjs.com/get-npm)
 - Pm2 : [Installation](https://pm2.keymetrics.io/docs/usage/quick-start/)

*Tested with :*
 - *Node : 12.9.0*
 - *Npm  : 6.10.2*
 - *Pm2 : 4.4.0*



## Installation

Clone the repository

      git clone https://github.com/jabet1/Network_Gate_Counter_Server.git

Go in the folder.
Install the node modules :

    npm install

Modifiy the config.js file to correspond yours needs :

 - Port
 - Password
 - People Maximum in the building (triger alert on phones and logs)

You need to restart the server for modification to take effect.
## Admin


Start :

    pm2 start ecosystem.config.js

Stop : 	

     pm2 stop "Network Gate Counter"
Delete :

    pm2 delete "Network Gate Counter"

See statut :

    pm2 ls

(more command [here](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/#managing-processes))
