import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DocsPage() {
  return (
    <div className="container py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Documentation</h1>

      <div className="grid gap-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Learn how to use the Ramadhan App</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-medium">Prayer Times</h3>
            <p>
              The prayer times feature displays accurate prayer times for your selected location. You can change your
              location by using the city selector at the top of the home page.
            </p>

            <h3 className="text-lg font-medium">Itiqaf Registration</h3>
            <p>
              To register for Itiqaf, navigate to the "Daftar" page and fill out the registration form. You can register
              yourself and family members if applicable.
            </p>

            <h3 className="text-lg font-medium">Attendance</h3>
            <p>
              Once registered and logged in, you can mark your attendance for Itiqaf through the dashboard. The system
              will also prompt you to confirm your attendance each day.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
            <CardDescription>Frequently asked questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">How do I register for Itiqaf?</h3>
              <p className="text-muted-foreground">
                Navigate to the "Daftar" page from the bottom navigation bar and fill out the registration form.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">How do I change my city for prayer times?</h3>
              <p className="text-muted-foreground">
                Use the city selector dropdown at the top of the home page to search and select your city.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">I forgot my login details. What should I do?</h3>
              <p className="text-muted-foreground">
                The login system uses your full name as registered. If you're having trouble, please contact the
                administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

