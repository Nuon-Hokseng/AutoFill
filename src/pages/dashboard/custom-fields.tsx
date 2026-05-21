import CustomTab from "~components/custom-tab"

export default function CustomFields() {
  return (
    <div className="mt-40 flex items-center justify-center gap-6">
      <div>
        <CustomTab goBack={() => {}} mode="web" />
      </div>
    </div>
  )
}
