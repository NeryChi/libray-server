// src/components/index.js
import AcadenicCapIcon_react_24_solid from '@heroicons/react/24/solid/AcademicCapIcon.js';
import PlusIcon_react_24_solid from '@heroicons/react/20/solid/PlusIcon.js';
import AcadenicCapIcon_react_24_outline from '@heroicons/react/24/outline/AcademicCapIcon.js';
import PlusIcon_react_20_solid from '@heroicons/react/20/solid/PlusIcon.js';

export const Libraries = {
  "@heroicons": {
    react: {
      24: {
        solid: {
          AcademicCapIcon: AcadenicCapIcon_react_24_solid,
          PlusIcon: PlusIcon_react_24_solid
        },
        outline: {
          AcademicCapIcon: AcadenicCapIcon_react_24_outline
        }
      },
      20: {
        solid: {
          PlusIcon: PlusIcon_react_20_solid,
        }
      }
    }
  }
};
