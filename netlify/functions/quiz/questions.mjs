// Question bank — "Quiz sécurité – Induction mLNG Tendrara".
// SERVER-SIDE ONLY: this file holds the answer key and must never be published
// as a static asset (netlify.toml publishes only the `public/` directory).
//
// `answer` is the 0-based index of the correct option in the original order.
// Options are shuffled per attempt by the server; the client never sees `answer`.

export const QUESTIONS = [
  {
    id: 'q1',
    fr: {
      text: 'À quelle température le GNL est-il stocké ?',
      options: ['0 °C', '−40 °C', '−162 °C', '−273 °C'],
      explanation: 'Le GNL est un liquide cryogénique : risque de brûlure froide au contact.'
    },
    en: {
      text: 'At what temperature is LNG stored?',
      options: ['0 °C', '−40 °C', '−162 °C', '−273 °C'],
      explanation: 'LNG is a cryogenic liquid: contact causes cold burns.'
    },
    answer: 2
  },
  {
    id: 'q2',
    fr: {
      text: "Vous entendez la sirène d'alarme. Que faites-vous ?",
      options: [
        'Je termine ma tâche, puis je sors',
        "J'arrête le travail et les équipements, je suis les itinéraires d'évacuation jusqu'au point de rassemblement et j'y reste jusqu'à la fin d'alerte",
        'Je prends ma voiture et je quitte le site',
        'Je vais voir ce qui se passe'
      ],
      explanation: ''
    },
    en: {
      text: 'You hear the alarm siren. What do you do?',
      options: [
        'Finish your task, then leave',
        'Stop work, stop the equipment, follow the evacuation routes to the assembly point and stay there until the all-clear',
        'Go to your car and drive off the site',
        'Go and see what is happening'
      ],
      explanation: ''
    },
    answer: 1
  },
  {
    id: 'q3',
    fr: {
      text: 'Pouvez-vous utiliser votre téléphone portable en zone ATEX ?',
      options: [
        'Oui, pour un appel court',
        'Oui, en mode avion',
        "Non, c'est interdit : un téléphone peut enflammer le gaz",
        "Seulement avec l'accord d'un collègue"
      ],
      explanation: ''
    },
    en: {
      text: 'Can you use your mobile phone in an ATEX zone?',
      options: [
        'Yes, for short calls',
        'Yes, in flight mode',
        'No, it is forbidden: a phone can ignite gas',
        'Only with permission from your colleague'
      ],
      explanation: ''
    },
    answer: 2
  },
  {
    id: 'q4',
    fr: {
      text: 'Le GNL et ses vapeurs sont incolores et inodores. Comment détecte-t-on une fuite ?',
      options: ["À l'odeur", 'À la couleur', 'Par les détecteurs de gaz fixes', 'Au bruit'],
      explanation: ''
    },
    en: {
      text: 'LNG and its vapours are colourless and odourless. How is a leak detected?',
      options: ['By its smell', 'By its colour', 'By the fixed gas detectors', 'By its noise'],
      explanation: ''
    },
    answer: 2
  },
  {
    id: 'q5',
    fr: {
      text: 'Un feu se déclare sur une fuite de GNL. Que ne faut-il jamais projeter sur la nappe de GNL ?',
      options: [
        'De la mousse haut foisonnement',
        'De la poudre chimique',
        "De l'eau",
        'Rien, on laisse brûler sous contrôle'
      ],
      explanation: "L'eau accélère la vaporisation. On utilise de la mousse sur la nappe."
    },
    en: {
      text: 'There is a fire on an LNG spill. What must never be used on the LNG pool?',
      options: [
        'High-expansion foam',
        'Dry chemical powder',
        'Water',
        'Nothing, let it burn out under control'
      ],
      explanation: 'Water speeds up vaporisation. Foam is used on the spill instead.'
    },
    answer: 2
  },
  {
    id: 'q6',
    fr: {
      text: 'En se réchauffant, 1 volume de GNL produit environ combien de volumes de gaz ?',
      options: ['6', '60', '600', '6 000'],
      explanation: 'Du GNL piégé qui se réchauffe peut provoquer une surpression en espace confiné.'
    },
    en: {
      text: 'When it warms up, 1 volume of LNG gives about how many volumes of gas?',
      options: ['6', '60', '600', '6,000'],
      explanation: 'Trapped LNG that warms up can over-pressurise a confined space.'
    },
    answer: 2
  },
  {
    id: 'q7',
    fr: {
      text: 'Quel numéro appelez-vous pour les pompiers ?',
      options: ['190', '177', '150', '112'],
      explanation: '190 = police, 177 = gendarmerie.'
    },
    en: {
      text: 'Which number do you call for the fire brigade?',
      options: ['190', '177', '150', '112'],
      explanation: '190 = police, 177 = gendarmerie.'
    },
    answer: 2
  },
  {
    id: 'q8',
    fr: {
      text: 'Quels EPI sont obligatoires sur le site ?',
      options: [
        'Casque et chaussures de sécurité uniquement',
        'Gilet haute visibilité uniquement',
        'Casque, lunettes de sécurité, gants, gilet haute visibilité, chaussures de sécurité et protection auditive',
        'Aucun EPI pour les visiteurs'
      ],
      explanation: ''
    },
    en: {
      text: 'Which PPE is mandatory on site?',
      options: [
        'Helmet and safety shoes only',
        'Hi-vis vest only',
        'Helmet, safety glasses, gloves, hi-vis vest, safety shoes and hearing protection',
        'No PPE for visitors'
      ],
      explanation: ''
    },
    answer: 2
  },
  {
    id: 'q9',
    fr: {
      text: 'Que devez-vous lire avant de manipuler un produit chimique ?',
      options: [
        'Le bon de livraison',
        'La fiche de données de sécurité (FDS)',
        'Le plan du site',
        'Rien, les gants suffisent'
      ],
      explanation: ''
    },
    en: {
      text: 'What must you read before handling a chemical product?',
      options: [
        'The delivery note',
        'The safety data sheet (SDS)',
        'The site map',
        'Nothing, gloves are enough'
      ],
      explanation: ''
    },
    answer: 1
  },
  {
    id: 'q10',
    fr: {
      text: 'Quel est le premier objectif HSE du site ?',
      options: ['Zéro retard', 'Zéro accident avec arrêt de travail', 'Zéro visiteur', 'Zéro heure supplémentaire'],
      explanation: ''
    },
    en: {
      text: 'What is the first HSE objective of the site?',
      options: ['Zero delays', 'Zero lost-time accidents', 'Zero visitors', 'Zero overtime'],
      explanation: ''
    },
    answer: 1
  }
];
