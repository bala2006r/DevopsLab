# Use official lightweight Nginx image
FROM nginx:alpine

# Remove default nginx website files
RUN rm -rf /usr/share/nginx/html/*

# Copy Attendance Tracker static web assets into Nginx html directory
COPY index.html style.css app.js /usr/share/nginx/html/

# Expose port 80 for web traffic
EXPOSE 80

# Run Nginx in foreground
CMD [nginx, -g, daemon off;]
