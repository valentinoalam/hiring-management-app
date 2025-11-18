const FullViewError = ({ title, message, icon: Icon }: { 
  title: string; 
  message: string; 
  icon: React.ElementType;
}) => (
  <div className="min-h-screen bg-muted/40 flex items-center justify-center p-8">
    <div className="max-w-md w-full text-center bg-card rounded-2xl shadow-lg p-8 border border-border">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <Icon className="w-10 h-10 text-destructive" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-card-foreground mb-4">{title}</h1>
      <p className="text-muted-foreground mb-6 leading-relaxed">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default FullViewError;