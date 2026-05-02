import { Provider } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

export const FIREBASE_APP = 'FIREBASE_APP';

export const FirebaseProvider: Provider = {
  provide: FIREBASE_APP,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    // Évite de réinitialiser si déjà fait (hot reload)
    if (admin.apps.length) return admin.apps[0];

    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId:    config.get('FIREBASE_PROJECT_ID'),
        clientEmail:  config.get('FIREBASE_CLIENT_EMAIL'),
        privateKey:   config.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      }),
    });
  },
};