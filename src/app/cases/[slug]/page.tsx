import React from 'react';
import { notFound } from 'next/navigation';
import {
  getCaseBySlug,
  getCasesCatalog,
} from '@/lib/repositories/case-repository';
import { CaseOpeningArena } from '@/components/cases/CaseOpeningArena';

interface CasePageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const cases = await getCasesCatalog();
  return cases.map((c) => ({ slug: c.slug }));
}

export default async function CasePage({ params }: CasePageProps) {
  const caseBox = await getCaseBySlug(params.slug);

  if (!caseBox) {
    notFound();
  }

  return <CaseOpeningArena caseBox={caseBox} />;
}
