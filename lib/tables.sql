create table if not exists searchable_industry (
	id varchar(63) PRIMARY KEY,
    description varchar(511),
    parent_industry_id varchar(63),

      CONSTRAINT parent_industry_id_fk FOREIGN KEY (parent_industry_id) REFERENCES searchable_industry (id)

) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;



insert into searchable_industry (id, description) values (uuid(), 'Machine manufacturing');
insert into searchable_industry (id, description, parent_industry_id) (select uuid(), 'CNC machine manufacturing', id from searchable_industry where description = 'Machine manufacturing');insert into searchable_industry (id, description) values (uuid(), 'Programming services');
insert into searchable_industry (id, description) (select id, 'App development' from searchable_industry where description = 'Programming services');
insert into searchable_industry (id, description, parent_industry_id) (select uuid(), 'App development', id from searchable_industry where description = 'Programming services');





