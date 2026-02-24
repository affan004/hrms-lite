type MessageTone = "info" | "warning" | "error";

interface StateMessageProps {
  message: string;
  tone?: MessageTone;
}

export function StateMessage({ message, tone = "info" }: StateMessageProps) {
  return <p className={`state-message ${tone}`}>{message}</p>;
}

