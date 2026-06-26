export class SuggestSectionAcceptedDto {
  assignmentId!: string;
  status!: 'pending' | 'processing';
  message!: string;
}

export class SuggestionAssignmentResponseDto {
  assignmentId!: string;
  sectionKey!: string;
  status!: 'pending' | 'processing' | 'completed' | 'failed';
  suggestion?: Record<string, unknown>;
  error?: string;
  message?: string;
}
