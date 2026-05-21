import ProfileTab from "~components/profile-tab"

export default function WebsiteProfiles() {
  return (
    <div className="mt-40 flex items-center justify-center gap-6">
      <div>
        <ProfileTab goBack={() => {}} />
      </div>
    </div>
  )
}
