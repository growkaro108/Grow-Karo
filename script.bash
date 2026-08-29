# //write a script that will auto mate create a docker image of frontend and backend
# // and run on local 

echo "Starting the backend container..."
docker build -t growwkaro/frontend:v2 ./grow-karo
echo "Frontend container created successfully!"
docker push growwkaro/frontend:v2
echo "Frontend container pushed successfully!"

echo "Starting the frontend container..."
docker build -t growwkaro/backend:v2 ./backend
echo "Backend container created successfully!"
docker push growwkaro/backend:v2
echo "Backend container pushed successfully!"


echo "Frontend and Backend containers are builted & pushed successfully..!" 