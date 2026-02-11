import * as Users from "../../model/user";

export const requireAdmin = async (ctx: any) => {
  const userData = await Users.getUserAndProfile(ctx);

  if (!userData?.profile?.isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  return userData;
};
