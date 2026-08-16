import type { AdminUser } from "../_lib/user-display";
import { UserCard } from "./user-card";
import { UsersTable } from "./users-table";

export function UsersList({ users }: { users: AdminUser[] }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {users.map((user) => (
          <UserCard key={user._id} user={user} />
        ))}
      </div>
      <div className="hidden md:block">
        <UsersTable users={users} />
      </div>
    </>
  );
}
