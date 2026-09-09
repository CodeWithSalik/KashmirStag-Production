# MongoDB Atlas setup

This project reads exactly one connection setting: `MONGODB_URI`. Keep it only in `.env.local` on your computer and in your deployment provider's encrypted environment settings. Never commit it.

1. Create or sign in to [MongoDB Atlas](https://www.mongodb.com/atlas/database).
2. Create a free `M0` cluster, choose the closest region, and wait until it is ready.
3. In **Security > Database Access**, create a database user with a long generated password. For now, give it `readWrite` access to the `kashmirstag` database.
4. In **Security > Network Access**, add your development machine's current IP address. Add the production host's outbound IP too when deploying. Do not use `0.0.0.0/0` except as a short-lived diagnostic step.
5. Click **Connect > Drivers**, select **Node.js**, and copy the `mongodb+srv://...` connection string.
6. Replace `<password>` with the URL-encoded database-user password and end the path with `/kashmirstag` to use the new database.

Example:

```env
MONGODB_URI=mongodb+srv://kashmirstag_app:URL_ENCODED_PASSWORD@cluster0.example.mongodb.net/kashmirstag?retryWrites=true&w=majority
```

Add that line to `.env.local`, alongside the existing application keys. For deployment, add the identical value as `MONGODB_URI` in the hosting dashboard, then redeploy.

When you send the new URI here, send it only in this private task. I will place it in the local configuration and verify the database connection without printing the secret back to you.
