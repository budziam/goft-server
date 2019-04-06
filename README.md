Guardians of the future - server
====


```bash
docker run -it --rm \
    -v /home/ubuntu/gotf/gotf-server/data/nginx/certs:/etc/letsencrypt \
    -v /home/ubuntu/gotf/gotf-server/data/nginx/certs-data:/data/letsencrypt \
    deliverous/certbot \
    certonly \
    --webroot \
    --webroot-path=/data/letsencrypt \
    -d gotf.sklep-sms.pl
```
