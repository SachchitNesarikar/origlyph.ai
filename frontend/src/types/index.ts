export interface VerifiedFact {
  id: string;
  category: string;
  fact_text: string;
  source_citation: string;
}

export interface Relation {
  target_id: string;
  relation_type: string;
  target_name: string;
  target_type: 'Creator' | 'Place' | 'Cultural Tradition' | 'Collection' | 'Artifact' | string;
  evidence_source_id?: string | null;
  notes?: string | null;
}

export interface Artifact {
  id: string;
  title: string;
  description: string;
  media_url?: string | null;
  thumbnail_url?: string | null;
  source_name: string;
  source_url: string;
  creator?: string | null;
  date_created?: string | null;
  creation_location?: string | null;
  depicted_location?: string | null;
  discovery_location?: string | null;
  current_collection?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_basis?: 'creation' | 'depicted' | 'discovery' | string | null;
  location_confidence: 'verified' | 'approximate' | 'unverified' | string;
  rights_statement?: string | null;
  attribution?: string | null;
  verified_facts: VerifiedFact[];
  relations: Relation[];
}

export interface ArtifactChallengeView {
  id: string;
  title: string;
  description: string;
  media_url?: string | null;
  thumbnail_url?: string | null;
  source_name: string;
  source_url: string;
  creator?: string | null;
  date_created?: string | null;
  location_basis?: string | null;
  location_confidence: string;
  rights_statement?: string | null;
  attribution?: string | null;
  verified_fact_count: number;
  is_playable: boolean;
}

export interface GuessResponse {
  artifact_id: string;
  guess_latitude: number;
  guess_longitude: number;
  target_latitude: number;
  target_longitude: number;
  distance_km: number;
  base_score: number;
  hint_penalty: number;
  final_score: number;
  max_score: number;
  location_basis: string;
  accuracy_rating: string;
  artifact: Artifact;
}

export interface HintResponse {
  artifact_id: string;
  hint_level: number;
  hint_text: string;
  score_penalty: number;
  supporting_fact_ids: string[];
  caveat_or_uncertainty?: string | null;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  is_center: boolean;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  evidence_source_id?: string | null;
  notes?: string | null;
}

export interface ProvenanceGraphResponse {
  artifact_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface HealthResponse {
  status: string;
  version: string;
  playable_artifacts: number;
  total_artifacts: number;
  environment: string;
}

export interface RoomPlayerView {
  nickname: string;
  submitted: boolean;
  score: number | null;
}

export interface RoomStateResponse {
  room_code: string;
  artifact: ArtifactChallengeView;
  players: RoomPlayerView[];
  player_count: number;
  capacity: number;
  own_guess: GuessResponse | null;
}

export interface RoomSessionResponse {
  player_token: string;
  room: RoomStateResponse;
}
