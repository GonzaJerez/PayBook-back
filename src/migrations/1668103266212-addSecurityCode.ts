import { MigrationInterface, QueryRunner } from 'typeorm';

export class addSecurityCode1668103266212 implements MigrationInterface {
  name = 'addSecurityCode1668103266212';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" double precision NOT NULL, "description" text NOT NULL DEFAULT '', "complete_date" bigint NOT NULL, "num_date" integer NOT NULL, "month" integer NOT NULL, "year" integer NOT NULL, "week" integer NOT NULL DEFAULT '1', "day_name" text NOT NULL, "accountId" uuid, "userId" uuid, "categoryId" uuid, "subcategoryId" uuid, "creditPaymentId" uuid, CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subcategories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "categoryId" uuid, CONSTRAINT "PK_793ef34ad0a3f86f09d4837007c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "accountId" uuid, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "credit_payment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "installments" integer NOT NULL DEFAULT '1', "installments_paid" integer NOT NULL DEFAULT '1', "isActive" boolean NOT NULL DEFAULT true, "accountId" uuid, "userId" uuid, "categoryId" uuid, "subcategoryId" uuid, CONSTRAINT "PK_7bd33ab099bbf611729ac7a563d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "password" text NOT NULL, "fullName" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "google" boolean NOT NULL DEFAULT false, "roles" text array NOT NULL DEFAULT '{user}', "revenue_id" text, "temporalSecurityCode" integer, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text NOT NULL DEFAULT '', "max_num_users" integer NOT NULL DEFAULT '10', "access_key" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "creatorUserId" uuid, "adminUserId" uuid, CONSTRAINT "UQ_57bbaeeb4903ddcde3514e62c6b" UNIQUE ("access_key"), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users_accounts" ("usersId" uuid NOT NULL, "accountsId" uuid NOT NULL, CONSTRAINT "PK_a87b4a6ef6f0e80591bc3fa4f43" PRIMARY KEY ("usersId", "accountsId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ff09021852acfc866f80ef743a" ON "users_accounts" ("usersId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_982bfd9cd9412107665365b7ec" ON "users_accounts" ("accountsId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_0877e9901d5296c2e7c7f59b018" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_ac0801a1760c5f9ce43c03bacd0" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_b6ee7d2bc11bc7a1421179a340e" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_f5d52e2aa6d5037b41316dd6893" FOREIGN KEY ("creditPaymentId") REFERENCES "credit_payment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" ADD CONSTRAINT "FK_d1fe096726c3c5b8a500950e448" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_81cea66ae6ded53813857cca003" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_payment" ADD CONSTRAINT "FK_f263ac96e18ae0fa40b55098983" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_payment" ADD CONSTRAINT "FK_825e5159a7afba3b162e8e6ec6e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_payment" ADD CONSTRAINT "FK_7631c33b0bd9c22365163968eb2" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_payment" ADD CONSTRAINT "FK_7e9a6142d2d615617b2d01a02f6" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_f91790d8a50b7619c03defa5c15" FOREIGN KEY ("creatorUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" ADD CONSTRAINT "FK_eee1c8fd082f905cefb4717a3c8" FOREIGN KEY ("adminUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_accounts" ADD CONSTRAINT "FK_ff09021852acfc866f80ef743a1" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_accounts" ADD CONSTRAINT "FK_982bfd9cd9412107665365b7ec6" FOREIGN KEY ("accountsId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users_accounts" DROP CONSTRAINT "FK_982bfd9cd9412107665365b7ec6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_accounts" DROP CONSTRAINT "FK_ff09021852acfc866f80ef743a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "FK_eee1c8fd082f905cefb4717a3c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "accounts" DROP CONSTRAINT "FK_f91790d8a50b7619c03defa5c15"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_payment" DROP CONSTRAINT "FK_7e9a6142d2d615617b2d01a02f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_payment" DROP CONSTRAINT "FK_7631c33b0bd9c22365163968eb2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_payment" DROP CONSTRAINT "FK_825e5159a7afba3b162e8e6ec6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "credit_payment" DROP CONSTRAINT "FK_f263ac96e18ae0fa40b55098983"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_81cea66ae6ded53813857cca003"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" DROP CONSTRAINT "FK_d1fe096726c3c5b8a500950e448"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_f5d52e2aa6d5037b41316dd6893"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_b6ee7d2bc11bc7a1421179a340e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_ac0801a1760c5f9ce43c03bacd0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_3d211de716f0f14ea7a8a4b1f2c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_0877e9901d5296c2e7c7f59b018"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_982bfd9cd9412107665365b7ec"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ff09021852acfc866f80ef743a"`,
    );
    await queryRunner.query(`DROP TABLE "users_accounts"`);
    await queryRunner.query(`DROP TABLE "accounts"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "credit_payment"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "subcategories"`);
    await queryRunner.query(`DROP TABLE "expenses"`);
  }
}
