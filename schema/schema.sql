create extension if not exists "uuid-ossp";

--
-- Tables
--

create table statements 
( id uuid primary key default uuid_generate_v4()
, nodes json
);

comment on table statements is 'statement table comment';

create type status_dzid_action_or_relation_enum as enum 
( 'approved'
, 'approved_with_recommendation'
, 'discouraged'
);

create table actions
( id uuid primary key default uuid_generate_v4()
 , status_dzid_action_or_relation status_dzid_action_or_relation_enum
 , parent_id uuid
 , quasisynonym_id uuid
 , subject text	
 , action_or_relation text
 , action_or_relation_english text
 , action_or_relation_middle_english text	
 , action_or_relation_synonyms text
 , actant1_valency text
 , actant1 text
 , actant1_modifier text	
 , actant2_valency text
 , actant2 text
 , actant2_modifier text	
 , action_or_relation_type text	
 , subtype1	text
 , subtype2 text
 , subtype3	text
 , subtype4	text
 , tags	text
 , related_concept_id text	
 , related_concept text
 , related_concept_english text
 , dissidence_level text
);

--
-- Records
--

insert into  statements (nodes) values ('{"a": 1, "b": 2, "c": 3}');