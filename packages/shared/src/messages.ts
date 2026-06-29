/**
 * Charte des messages Profilo'Z
 * Ton : professionnel, rassurant, simple, moderne, bienveillant.
 */
export const MSG = {
  validation: {
    required: 'Ce champ est obligatoire.',
    requiredAlt: 'Merci de renseigner ce champ.',
    requiredToContinue: 'Cette information est nécessaire pour continuer.',
    name: 'Veuillez saisir votre nom.',
    email: 'Veuillez saisir une adresse e-mail valide.',
    phone: 'Veuillez saisir un numéro de téléphone valide.',
    passwordMin: 'Le mot de passe doit contenir au moins 8 caractères.',
    passwordUppercase: 'Le mot de passe doit contenir au moins une majuscule.',
    passwordDigit: 'Le mot de passe doit contenir au moins un chiffre.',
    passwordMismatch: 'Les mots de passe ne correspondent pas.',
    date: 'Veuillez sélectionner une date valide.',
    url: 'Veuillez saisir une URL valide.',
    maxChars: (max: number) => `Maximum ${max} caractères.`,
    invalidData: 'Certaines informations sont incomplètes. Complétez-les pour continuer.',
  },

  upload: {
    success: 'Votre fichier a été importé avec succès.',
    error: "Le fichier n'a pas pu être importé.",
    format: "Ce format de fichier n'est pas pris en charge.",
    size: 'Le fichier dépasse la taille maximale autorisée.',
    ocrLoading: "L'analyse de votre CV est en cours...",
    ocrSteps: [
      'Analyse de votre document…',
      'Détection des expériences…',
      'Extraction des formations…',
      'Préparation de votre brouillon…',
    ] as const,
    ocrError:
      "Nous n'avons pas réussi à analyser ce document. Essayez avec un CV plus lisible.",
  },

  save: {
    success: 'Vos modifications ont été enregistrées.',
    error: "Impossible d'enregistrer vos modifications pour le moment.",
    inProgress: 'Enregistrement en cours...',
    autoSaved: (time: string) => `Enregistré · ${time}`,
    autoSaveFailed: "Impossible d'enregistrer vos modifications pour le moment.",
  },

  pdf: {
    loading: 'Génération de votre PDF...',
    success: 'Votre PDF est prêt.',
    error: 'Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.',
    steps: [
      'Préparation de votre CV…',
      'Mise en page du document…',
      'Génération de votre PDF…',
    ] as const,
  },

  letter: {
    loading: 'Génération de votre lettre de motivation...',
    success: 'Votre lettre est prête.',
    error: 'Impossible de générer votre lettre pour le moment.',
    createError: 'Impossible de créer votre lettre pour le moment.',
    saveError: "Impossible d'enregistrer votre lettre pour le moment.",
  },

  payment: {
    success: 'Paiement effectué avec succès.',
    cancelled: 'Le paiement a été annulé.',
    error: "Le paiement n'a pas pu être finalisé.",
    cancelledDetail: 'Aucun montant n’a été débité. Vous pouvez réessayer quand vous le souhaitez.',
    confirming: 'Votre paiement est en cours de confirmation.',
  },

  auth: {
    loginSuccess: 'Connexion réussie.',
    loginError: 'Adresse e-mail ou mot de passe incorrect.',
    sessionExpired: 'Votre session a expiré. Veuillez vous reconnecter.',
    accountNotFound: 'Aucun compte ne correspond à cette adresse e-mail.',
    registerError: 'Impossible de créer le compte. Vérifiez vos informations et réessayez.',
    accountExists: 'Un compte existe déjà avec cet e-mail.',
    logoutConfirm: 'Voulez-vous vous déconnecter ?',
    logoutTitle: 'Déconnexion',
  },

  network: {
    offline: 'Connexion Internet indisponible.',
    serverUnavailable: 'Le service est momentanément indisponible.',
    timeout: 'La requête a pris trop de temps. Veuillez réessayer.',
    contactFailed: 'Connexion au service impossible. Vérifiez votre connexion Internet.',
  },

  delete: {
    confirm: 'Voulez-vous vraiment supprimer cet élément ?',
    confirmDocument: 'Voulez-vous vraiment supprimer ce document ?',
    confirmLetter: 'Voulez-vous vraiment supprimer cette lettre ?',
    success: "L'élément a été supprimé.",
    error: "La suppression n'a pas pu être effectuée.",
    title: 'Supprimer',
    confirmLabel: 'Supprimer',
  },

  empty: {
    noResume: "Vous n'avez pas encore créé de CV.",
    noLetter: "Vous n'avez pas encore créé de lettre de motivation.",
    noDocument: 'Aucun document disponible.',
    noSearch: 'Aucun résultat trouvé.',
    noLetterInFolder: 'Aucune lettre dans ce dossier pour le moment.',
    noDocumentInFolder: 'Aucun document importé pour le moment.',
    noExperience: 'Aucune expérience détectée.',
    noEducation: 'Aucune formation détectée.',
    noLanguage: 'Aucune langue détectée.',
    noExperienceInDoc: 'Aucune expérience détectée dans ce document.',
    noEducationInDoc: 'Aucune formation détectée dans ce document.',
  },

  success: {
    generic: 'Opération réussie.',
    requestReceived: 'Votre demande a bien été prise en compte.',
    ready: 'Tout est prêt.',
    done: "C'est terminé !",
    accountCreated: 'Compte créé avec succès.',
  },

  error: {
    generic: 'Une erreur est survenue. Veuillez réessayer dans quelques instants.',
    loadResumes: 'Impossible de charger vos dossiers pour le moment.',
    loadLetters: 'Impossible de charger vos lettres pour le moment.',
    loadDocuments: 'Impossible de charger vos documents pour le moment.',
    loadPlans: 'Impossible de charger les offres pour le moment.',
    loadPrintCv: 'Impossible de charger le CV pour l’impression.',
    loadPrintLetter: 'Impossible de charger la lettre pour l’impression.',
    notFoundResume: 'Ce CV est introuvable.',
    notFoundLetter: 'Cette lettre est introuvable.',
    attachLetter: 'Impossible de classer la lettre dans ce dossier.',
    renameFolder: 'Impossible de renommer le dossier pour le moment.',
    generateDossier: 'Impossible de générer le dossier complet pour le moment.',
    deleteLetter: "La suppression n'a pas pu être effectuée.",
  },

  confirm: {
    title: 'Attention',
    cancel: 'Annuler',
    continue: 'Continuer',
    retry: 'Réessayer',
    back: 'Retour',
    support: 'Contacter le support',
  },

  guide: {
    createCvTitle: 'Créons votre CV',
    createCvSubtitle: 'Guidé étape par étape. En moins de 5 minutes.',
    createCvCta: 'Créer mon CV',
    importCvLink: "J'ai déjà un CV à importer",
    importLetterLink: 'Importer une lettre existante',
    infoStep: 'Étape 1 · Commençons par vos informations.',
    modelStep: 'Étape 2 · Choisissez le modèle qui vous plaît.',
    modelSelected: "Parfait ! Il ne reste plus qu'à compléter votre parcours.",
    successHeadline: 'Votre CV professionnel est prêt.',
    successLead:
      'Téléchargez-le maintenant ou créez un compte gratuit pour le retrouver et le modifier plus tard.',
    accountPitch: 'Créez un compte gratuit pour retrouver votre CV',
    accountBenefits: [
      'Retrouver vos CV à tout moment',
      'Créer plusieurs versions',
      "Accéder à l'historique",
    ] as const,
    dashboardPrompt: "Que souhaitez-vous faire aujourd'hui ?",
    recentFolders: 'Vos dossiers récents',
  },

  buttons: {
    continue: 'Continuer',
    downloadPdf: 'Télécharger mon PDF',
    createLetter: 'Créer ma lettre',
    createAccount: 'Créer mon compte',
    renameFolder: 'Renommer',
  },

  wizard: {
    chooseTemplate: 'Choisissez un modèle pour continuer.',
    nameAndEmail: 'Merci de renseigner votre nom et votre adresse e-mail.',
    completeEducation: 'Complétez chaque formation ou supprimez-la pour continuer.',
    completeExperience: 'Complétez chaque expérience ou supprimez-la pour continuer.',
  },

  photo: {
    size: 'La photo dépasse la taille maximale autorisée.',
    uploadError: "La photo n'a pas pu être importée.",
    base64Rejected: 'Veuillez importer votre photo via le bouton prévu à cet effet.',
  },

  actions: {
    createFolder: 'Créer mon dossier',
    retry: 'Réessayer',
  },
} as const

export type MessageKey = typeof MSG
