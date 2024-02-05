const pgp = pgPromise();
const db = pgp({
  host: "containers-us-west-155.your-host.com",
  port: 7917,
  database: "your-database",
  user: "postgres",
  password: "your-password",
});

export const ApiKeyArray = [
    '239asH3yR2K2onO0S21-example-api-key',
]
