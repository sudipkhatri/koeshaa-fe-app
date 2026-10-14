import type { Messages } from "./types";

export const ne = {
  app: {
    name: "केओशा",
    tagline: "कक्षा अनुसार सिक्नुहोस्, दोहोर्याउनुहोस् र खेल्नुहोस्।",
  },
  errors: {
    network: "इन्टरनेट छैन। जडान जाँचेर फेरि प्रयास गर्नुहोस्।",
    unknown: "केही गडबड भयो। फेरि प्रयास गर्नुहोस्।",
    tooManyCodes: "धेरै कोड पठाइयो। {time} पछि फेरि प्रयास गर्नुहोस्।",
  },
} satisfies Messages;
