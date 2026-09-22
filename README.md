# Wasabi Drive Web Application

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

View objects from a [Wasabi](https://wasabi.com/) Cloud Storage.

## Production deployment

Firebase Hosting uses the repository-local `firebase-tools` npm package. Its
`firebase` CLI executable is available through npm scripts, so a global
Firebase CLI installation is not required.

Before deploying, configure the production `REACT_APP_*` values because they
are embedded at build time. Run the supported production command with:

```text
npm run deploy:prd
```

There is no frontend `deploy:test` command yet. A stable test Firebase target
will be introduced in Phase 6 Task 6F.

## Screenshots

Login page:
![](./specs/ui_wasabi_drive_01.jpg)

Home page:
![](./specs/ui_wasabi_drive_02.jpg)

Objects page:
![](./specs/ui_wasabi_drive_03.jpg)