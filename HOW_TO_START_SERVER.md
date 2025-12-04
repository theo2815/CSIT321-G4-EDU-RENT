# 🚀 How to Start EduRent Backend Server

## ⚠️ IMPORTANT: The forgot password feature is ready, but you need to compile and run the backend first.

---

## Method 1: Using Your IDE (RECOMMENDED)

### If you're using **IntelliJ IDEA**:
1. Open IntelliJ IDEA
2. Open project: `C:\Users\L24Y16W18\Desktop\EDURENT\edurentbackend`
3. Wait for Maven to download dependencies (bottom right corner)
4. Find `CrcApplication.java` in the Project Explorer
5. Right-click on `CrcApplication.java`
6. Select **"Run 'CrcApplication.main()'"**
7. Server will start on `http://localhost:8080`

### If you're using **VS Code**:
1. Open VS Code
2. Install "Extension Pack for Java" if not installed
3. Open folder: `C:\Users\L24Y16W18\Desktop\EDURENT\edurentbackend`
4. Open `src/main/java/com/edurent/crc/CrcApplication.java`
5. Click the "Run" button above the `main` method
6. Or press `F5` to start debugging
7. Server will start on `http://localhost:8080`

### If you're using **Eclipse**:
1. Open Eclipse
2. File → Import → Existing Maven Projects
3. Select `C:\Users\L24Y16W18\Desktop\EDURENT\edurentbackend`
4. Wait for Maven dependencies to download
5. Right-click on project → Run As → Spring Boot App
6. Server will start on `http://localhost:8080`

---

## Method 2: Using Command Line (if Maven is installed)

```powershell
cd C:\Users\L24Y16W18\Desktop\EDURENT\edurentbackend
mvn spring-boot:run
```

**Note:** Maven is NOT currently installed on your system. Use Method 1 instead.

---

## Method 3: Manual Compilation and Run

If you want to compile manually without IDE:

### Step 1: Install Maven
Download from: https://maven.apache.org/download.cgi
Extract and add to PATH

### Step 2: Compile
```powershell
cd C:\Users\L24Y16W18\Desktop\EDURENT\edurentbackend
mvn clean install -DskipTests
```

### Step 3: Run
```powershell
mvn spring-boot:run
```

---

## ✅ How to Verify Backend is Running

Once started, you should see:
```
Started CrcApplication in X.XXX seconds
```

Then test in browser:
- Open: http://localhost:8080/api/v1/schools
- You should see JSON data (list of schools)

---

## 🧪 Testing Forgot Password Feature

### AFTER backend is running:

1. **Make sure you have a user account**:
   - Either register through your frontend
   - Or register via API:
   ```javascript
   fetch('http://localhost:8080/api/v1/auth/register', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'test@university.edu',
       password: 'Password123',
       fullName: 'Test User',
       studentIdNumber: '12345',
       schoolId: 1  // Use actual school ID from your database
     })
   }).then(r => r.json()).then(console.log);
   ```

2. **Test Forgot Password**:
   ```javascript
   // Open browser console (F12) and run:
   fetch('http://localhost:8080/api/v1/auth/forgot-password', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'test@university.edu' })
   }).then(r => r.json()).then(console.log);
   ```

3. **Check email** (test@university.edu) for reset link

4. **Reset password** using token from email:
   ```javascript
   fetch('http://localhost:8080/api/v1/auth/reset-password', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       token: 'TOKEN_FROM_EMAIL',
       newPassword: 'NewPassword123'
     })
   }).then(r => r.json()).then(console.log);
   ```

5. **Login with new password**:
   ```javascript
   fetch('http://localhost:8080/api/v1/auth/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       email: 'test@university.edu',
       password: 'NewPassword123'
     })
   }).then(r => r.json()).then(console.log);
   ```

---

## 🌐 Starting Frontend (React)

To test the full flow with UI:

```powershell
cd C:\Users\L24Y16W18\Desktop\EDURENT\edurentfrontend
npm install
npm run dev
```

Then:
1. Open http://localhost:5173
2. Try to login
3. Click "Forgot Password?" link (if you added it)
4. Follow the forgot password flow

---

## 🐛 Troubleshooting

### "Port 8080 already in use"
Another app is using port 8080. Either:
- Stop the other app
- Or change port in `edurentbackend/src/main/resources/application.properties`:
  ```properties
  server.port=8081
  ```

### "Database connection failed"
Check your PostgreSQL/Supabase database is running and credentials in `application.properties` are correct.

### "Email not sending"
- Check Gmail app password is correct: `zxwoomlltifslose`
- Verify 2FA is enabled on `edurentnoreply@gmail.com`
- Check Spring Boot console for error messages

---

## 📝 Next Steps

1. **Start the backend** using Method 1 (your IDE)
2. **Verify it's running** by visiting http://localhost:8080/api/v1/schools
3. **Start your React frontend** (if you have one)
4. **Test the forgot password feature** using browser console or your frontend

---

**Need Help?** 
- Check if your IDE can detect the Spring Boot project
- Make sure Java 17+ is installed (you have Java 19 ✅)
- Ensure PostgreSQL/Supabase database connection is working
