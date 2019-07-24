#!/bin/bash

echo "Delete all x-pack modules..."
find modules -type d -name "x-pack-*" -exec rm -r {} +

cp -f /tmp/elasticsearch.yml /usr/share/elasticsearch/config/elasticsearch.yml
chown -R 1000:1000 /usr/share/elasticsearch/config/elasticsearch.yml

echo "Setting up data directory"

mkdir /data
mkdir /data/snapshots
mkdir /data/data
mkdir /data/logs
chown -R 1000:1000 /data

mkdir /usr/share/elasticsearch/config/analysis
chown -R 1000:1000 /usr/share/elasticsearch/config/analysis

if [[ ! -z $GOOGLE_APPLICATION_CREDENTIALS ]]; then
    echo "Creating gcs permissions..."
    sudo -u elasticsearch -E bin/elasticsearch-keystore create
    sudo -u elasticsearch -E bin/elasticsearch-keystore add-file gcs.client.default.credentials_file $GOOGLE_APPLICATION_CREDENTIALS
    echo "Finished gcs permissions..."
fi

echo "Set vm.max_map_count=262144 in host"
sysctl -w vm.max_map_count=262144

echo "Current max locked memory in host: "
ulimit -l
echo "Set max locked memory to unlimited in host"
ulimit -l unlimited
echo "New max locked memory: "
ulimit -l

echo "Starting up"
/usr/local/bin/docker-entrypoint.sh