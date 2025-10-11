<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->decimal('last_risk_score', 5, 2)->nullable()->after('dds_trend_1_3');
            $table->string('last_risk_label', 50)->nullable()->after('last_risk_score');
            $table->string('risk_model_version', 50)->nullable()->after('last_risk_label');
            $table->timestamp('last_predicted_at')->nullable()->after('risk_model_version');
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn(['last_risk_score', 'last_risk_label', 'risk_model_version', 'last_predicted_at']);
        });
    }
};
