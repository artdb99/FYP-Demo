#!/bin/bash
echo "Setting document root to /home/site/wwwroot/public"
sed -i 's|root /home/site/wwwroot;|root /home/site/wwwroot/public;|' /etc/nginx/sites-available/default
systemctl restart nginx