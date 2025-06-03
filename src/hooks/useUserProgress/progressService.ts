
import { userProgressService } from "./services/userProgressService";
import { courseProgressService } from "./services/courseProgressService";
import { unitProgressService } from "./services/unitProgressService";

export const progressService = {
  ...userProgressService,
  ...courseProgressService,
  ...unitProgressService
};
