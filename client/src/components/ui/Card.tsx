import { Card as BSCard } from 'react-bootstrap';
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return <BSCard className={className}>{children}</BSCard>;
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return <BSCard.Header className={className}>{children}</BSCard.Header>;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return <BSCard.Body className={className}>{children}</BSCard.Body>;
}
