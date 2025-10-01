import { type SubscriptionPlan } from "~/types";

export const freePlan: SubscriptionPlan = {
  name: "Free",
  description:
    "You can create up to 3 Projects. Upgrade to the PRO plan for unlimited projects.",
};

export const proPlan: SubscriptionPlan = {
  name: "PRO",
  description: "Now you have unlimited projects!",
};
