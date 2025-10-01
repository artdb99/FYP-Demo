<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->unsignedBigInteger('assigned_doctor_id')->nullable()->after('user_id');
            $table->index('assigned_doctor_id');
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropIndex(['assigned_doctor_id']);
            $table->dropColumn('assigned_doctor_id');
        });
    }
};
