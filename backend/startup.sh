#!/bin/bash
echo "Copying custom Nginx configuration"
cp /home/site/wwwroot/nginx.conf /etc/nginx/sites-available/default
echo "Reloading Nginx"
nginx -s reload
