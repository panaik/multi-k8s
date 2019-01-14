docker build -t panaik/multi-client:latest -t panaik/multi-client:$SHA -f ./client/Dockerfile ./client
docker build -t panaik/multi-server:latest -t panaik/multi-server:$SHA -f ./server/Dockerfile ./server
docker build -t panaik/multi-worker:latest -t panaik/multi-worker:$SHA -f ./worker/Dockerfile ./worker

docker push panaik/multi-client:latest
docker push panaik/multi-server:latest
docker push panaik/multi-worker:latest

docker push panaik/multi-client:$SHA
docker push panaik/multi-server:$SHA
docker push panaik/multi-worker:$SHA

kubectl apply -f k8s
kubectl set image deployments/server-deployment server=panaik/multi-server:$SHA
kubectl set image deployments/client-deployment client=panaik/multi-client:$SHA
kubectl set image deployments/worker-deployment worker=panaik/multi-worker:$SHA