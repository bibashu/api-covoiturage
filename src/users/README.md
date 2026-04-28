# Module Users — Documentation complète

## Installation des dépendances

```bash
npm install cloudinary multer
npm install -D @types/multer
```

## Variables d'environnement requises

```env
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
CLOUDINARY_FOLDER=covoiturage/profiles
```

## Structure des fichiers

```
src/
├── common/
│   └── cloudinary/
│       ├── cloudinary.provider.ts    # Configure cloudinary.config()
│       ├── cloudinary.service.ts     # uploadProfilePhoto(), deletePhoto()
│       ├── cloudinary.module.ts      # Exporte CloudinaryService
│       └── multer.config.ts          # memoryStorage, validation MIME + taille
└── users/
    ├── entities/
    │   └── user.entity.ts            # Entité TypeORM + bcrypt hooks
    ├── dto/
    │   ├── user-response.dto.ts      # DTO sérialisé (exclut password, refreshToken)
    │   ├── update-user.dto.ts        # UpdateUserDto, UpdateEmailDto, UpdatePasswordDto
    │   └── query-users.dto.ts        # Filtres + pagination
    ├── users.controller.ts           # 14 endpoints REST
    ├── users.service.ts              # Logique métier complète
    └── users.module.ts               # Importe CloudinaryModule
```

## Endpoints REST

### Lecture
| Méthode | Route              | Rôle      | Description                          |
|---------|--------------------|-----------|--------------------------------------|
| GET     | /users             | ADMIN     | Lister avec filtres + pagination     |
| GET     | /users/me          | Tout      | Mon profil                           |
| GET     | /users/me/stats    | Tout      | Mes statistiques                     |
| GET     | /users/:id         | Tout      | Profil public d'un utilisateur       |
| GET     | /users/:id/stats   | Tout      | Statistiques d'un utilisateur        |

### Modification
| Méthode | Route               | Rôle      | Description                          |
|---------|---------------------|-----------|--------------------------------------|
| PATCH   | /users/me           | Tout      | Modifier mon profil                  |
| PATCH   | /users/me/email     | Tout      | Changer mon email (mdp requis)       |
| PATCH   | /users/me/password  | Tout      | Changer mon mot de passe             |
| PATCH   | /users/:id          | ADMIN     | Modifier un utilisateur              |
| PATCH   | /users/:id/verify   | ADMIN     | Vérifier / valider un utilisateur    |
| PATCH   | /users/:id/restore  | ADMIN     | Réactiver un compte désactivé        |

### Photo (Cloudinary)
| Méthode | Route               | Rôle      | Description                          |
|---------|---------------------|-----------|--------------------------------------|
| POST    | /users/me/photo     | Tout      | Uploader / remplacer ma photo        |
| POST    | /users/:id/photo    | ADMIN     | Uploader la photo d'un utilisateur   |
| DELETE  | /users/me/photo     | Tout      | Supprimer ma photo                   |

### Suppression
| Méthode | Route               | Rôle      | Description                          |
|---------|---------------------|-----------|--------------------------------------|
| DELETE  | /users/me           | Tout      | Désactiver mon compte (soft delete)  |
| DELETE  | /users/:id          | ADMIN     | Désactiver un compte                 |
| DELETE  | /users/:id/hard     | ADMIN     | Suppression définitive + Cloudinary  |

## Comportements clés

### Upload photo (Cloudinary)
- Stockage en mémoire (memoryStorage) → stream vers Cloudinary
- Transformation automatique : 400×400px, recadrage face, qualité auto, format auto (WebP)
- `public_id` fixe : `user_{uuid}` → l'ancienne photo est écrasée automatiquement
- Suppression de l'ancienne photo avant chaque upload
- Formats acceptés : JPEG, PNG, WebP — max 5 Mo

### Suppression de compte
- `DELETE /users/me` : **soft delete** — `isActive = false`, refresh token invalidé
- `DELETE /users/:id/hard` : supprime la ligne SQL **et** la photo Cloudinary

### Note moyenne
La méthode `updateAverageRating(userId)` est publique et appelée par `ReviewsService`
après chaque création ou suppression d'avis. Elle recalcule depuis la table `reviews`
et persiste `averageRating` + `totalRatings` sur l'entité User.

## Intégration dans ReviewsService

```typescript
// src/reviews/reviews.service.ts
async create(dto: CreateReviewDto, authorId: string): Promise<Review> {
  const review = this.reviewRepo.create({ ...dto, authorId });
  const saved = await this.reviewRepo.save(review);

  // Recalcule la note moyenne de la cible
  await this.usersService.updateAverageRating(dto.targetId);

  return saved;
}
```

## Colonne à ajouter dans la migration

```typescript
// Dans user.entity.ts — déjà inclus
@Column({ nullable: true })
photoPublicId: string;
```

```bash
npm run migration:generate src/migrations/AddPhotoPublicIdToUsers
npm run migration:run
```
