// next/src/app/user/edit/page.tsx
import PageContainer from "~/components/layout/page-container";
import ProfileCreateForm from "./_components/user-form";
import getCurrentUser from "~/lib/server/current-user";

export default async function ProfileViewPage() {
  const user = await getCurrentUser();

  return (
    <PageContainer>
      <div className="space-y-4">
        <ProfileCreateForm initialData={user} />
      </div>
    </PageContainer>
  );
}
