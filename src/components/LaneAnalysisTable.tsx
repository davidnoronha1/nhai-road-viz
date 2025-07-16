import React from 'react';
import { Text, Box, Badge } from '@radix-ui/themes';
import { PathData } from './types';
import { getQualityColorScheme } from './utils';

const Em = ({ children }: { children: React.ReactNode }) => (
  <span className='data-pt'>
    {children}
  </span>
);

// Helper function to calculate and format difference from limit
const calculateDifference = (measured: number | null | undefined, limit: number | null | undefined): { diff: string; color: string; bgColor: string } => {
  if (measured == null || limit == null) {
    return { diff: 'N/A', color: 'var(--gray-11)', bgColor: 'var(--gray-2)' };
  }
  
  const difference = measured - limit;
  const absDiff = Math.abs(difference);
  
  if (difference > 0) {
    // Exceeds limit (bad)
    return { 
      diff: `+${absDiff.toFixed(1)}`, 
      color: 'var(--red-11)', 
      bgColor: 'var(--red-3)' 
    };
  } else if (difference < 0) {
    // Within limit (good)
    return { 
      diff: `-${absDiff.toFixed(1)}`, 
      color: 'var(--green-11)', 
      bgColor: 'var(--green-3)' 
    };
  } else {
    // Exactly at limit
    return { 
      diff: '0.0', 
      color: 'var(--yellow-11)', 
      bgColor: 'var(--yellow-3)' 
    };
  }
};

interface QualityScoreDisplayProps {
  score: number | null | undefined;
  isRightHalf?: boolean;
}

const QualityScoreDisplay: React.FC<QualityScoreDisplayProps> = ({ score, isRightHalf }) => {
  const displayScore = ((score ?? 0) * 100).toFixed(1);
  const colorScheme = getQualityColorScheme((score ?? 0) * 100);
  const tooltipText = score != null ? `Actual Value: ${(score * 100).toFixed(2)}` : 'N/A';

  return (
    <Text 
      size="1" 
      style={{ 
        textAlign: 'center', 
        padding: '6px 2px', 
        backgroundColor: colorScheme.backgroundColor, 
        borderRight: isRightHalf ? '2px solid var(--gray-7)' : '1px solid var(--gray-6)', 
        fontWeight: 'bold', 
        color: colorScheme.textColor, 
        borderTop: '1px solid var(--gray-6)' 
      }}
      title={tooltipText}
    >
      <Em>{displayScore}</Em>
    </Text>
  );
};

interface DifferenceDisplayProps {
  measured: number | null | undefined;
  limit: number | null | undefined;
  borderRight?: string;
  borderTop?: string;
}

const DifferenceDisplay: React.FC<DifferenceDisplayProps> = ({ measured, limit, borderRight, borderTop }) => {
  const { diff, color, bgColor } = calculateDifference(measured, limit);
  const tooltipText = measured != null && limit != null ? `Measured: ${measured.toFixed(2)}, Limit: ${limit.toFixed(2)}` : 'N/A';

  return (
    <Text
      size="1"
      style={{
        textAlign: 'center',
        padding: '6px 2px',
        backgroundColor: bgColor,
        color: color,
        borderRight: borderRight || 'none',
        borderTop: borderTop || 'none'
      }}
      title={tooltipText}
    >
      <Em>{diff}</Em>
    </Text>
  );
};

interface LaneAnalysisTableProps {
  selectedSegment: PathData;
  isMobile: boolean;
}

export const LaneAnalysisTable: React.FC<LaneAnalysisTableProps> = ({ selectedSegment, isMobile }) => {
  return (
    <Box>
      <Text size={isMobile ? "2" : "3"} weight="bold" style={{ marginBottom: '12px', display: 'block' }}>
        Lane-wise Analysis
      </Text>

      {/* Overall Average Quality Score */}
      <Box style={{ marginBottom: '16px' }}>
        <Text size="2" style={{ marginRight: '8px' }}>Overall Quality Score:</Text>
        <Badge 
          size="2"
          color={getQualityColorScheme((selectedSegment.overall_quality_score ?? 0) * 100).badgeColor}
        >
          {((selectedSegment.overall_quality_score ?? 0) * 100).toFixed(1)}%
        </Badge>
      </Box>

      {/* Lane-wise Data Table - Horizontally Scrollable on Mobile */}
      <Box
        style={{
          border: '1px solid var(--gray-6)',
          borderRadius: '6px',
          overflow: isMobile ? 'auto' : 'hidden',
          fontSize: isMobile ? '9px' : '10px',
          display: 'grid',
          gridTemplateColumns: isMobile 
            ? '80px 50px repeat(4, 60px) repeat(2, 60px) repeat(4, 60px)'
            : '100px 60px repeat(4, 1fr) repeat(2, 1fr) repeat(4, 1fr)',
          gap: '0px',
          minWidth: isMobile ? '600px' : 'auto',
        }}
      >
        {/* Header Row */}
        <Text size="1" weight="bold" style={{ textAlign: 'center', padding: isMobile ? '4px 2px' : '6px 4px', borderRight: '1px solid var(--gray-6)', backgroundColor: 'var(--gray-4)' }}>
          Parameter
        </Text>
        <Text size="1" weight="bold" style={{ textAlign: 'center', padding: isMobile ? '4px 2px' : '6px 4px', borderRight: '2px solid var(--gray-7)', backgroundColor: 'var(--gray-4)' }}>
          Limit
        </Text>
        {['L1', 'L2', 'L3', 'L4'].map((lane, idx) => (
          <Text key={lane} size="1" weight="bold" style={{ textAlign: 'center', padding: '6px 2px', borderRight: idx === 3 ? '2px solid var(--gray-7)' : '1px solid var(--gray-6)', backgroundColor: 'var(--gray-3)' }}>
            {lane}
          </Text>
        ))}
        <Text size="1" weight="bold" style={{ textAlign: 'center', padding: '6px 2px', borderRight: '1px solid var(--gray-6)', backgroundColor: 'var(--gray-3)' }}>
          L AVG
        </Text>
        <Text size="1" weight="bold" style={{ textAlign: 'center', padding: '6px 2px', borderRight: '2px solid var(--gray-7)', backgroundColor: 'var(--gray-3)' }}>
          R AVG
        </Text>
        {['R1', 'R2', 'R3', 'R4'].map((lane, idx) => (
          <Text key={lane} size="1" weight="bold" style={{ textAlign: 'center', padding: '6px 2px', borderRight: idx === 3 ? 'none' : '1px solid var(--gray-6)', backgroundColor: 'var(--gray-3)' }}>
            {lane}
          </Text>
        ))}

        {/* Quality Score Row */}
        <Text size="1" weight="bold" style={{ textAlign: 'left', padding: '6px 8px', borderRight: '1px solid var(--gray-6)', backgroundColor: 'var(--gray-1)', borderTop: '1px solid var(--gray-6)' }}>
          Quality Score<br />
          <span style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--gray-11)' }}>(% )</span>
        </Text>
        <Text size="1" style={{ textAlign: 'center', padding: '6px 4px', borderRight: '2px solid var(--gray-7)', backgroundColor: 'var(--gray-1)', borderTop: '1px solid var(--gray-6)' }}>
          <Em>-</Em>
        </Text>
        {[1, 2, 3, 4].map((lane, idx) => (
          <Text key={lane} size="1" style={{ textAlign: 'center', padding: '6px 2px', backgroundColor: 'var(--gray-2)', borderRight: idx === 3 ? '2px solid var(--gray-7)' : '1px solid var(--gray-6)', borderTop: '1px solid var(--gray-6)' }}>
            <Em>{((selectedSegment.left_half_quality_score ?? 0) * 100).toFixed(1)}</Em>
          </Text>
        ))}
        <QualityScoreDisplay score={selectedSegment.left_half_quality_score} />
        <QualityScoreDisplay score={selectedSegment.right_half_quality_score} isRightHalf={true} />
        {[1, 2, 3, 4].map((lane, idx) => (
          <Text key={lane} size="1" style={{ textAlign: 'center', padding: '6px 2px', backgroundColor: 'var(--gray-2)', borderRight: idx === 3 ? 'none' : '1px solid var(--gray-6)', borderTop: '1px solid var(--gray-6)' }}>
            <Em>{((selectedSegment.right_half_quality_score ?? 0) * 100).toFixed(1)}</Em>
          </Text>
        ))}

        {/* Roughness Row */}
        <Text size="1" weight="bold" style={{ textAlign: 'left', padding: '6px 8px', borderRight: '1px solid var(--gray-6)', backgroundColor: 'var(--gray-1)', borderTop: '1px solid var(--gray-6)' }}>
          Roughness<br />
          <span style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--gray-11)' }}>(BI mm/km)</span>
        </Text>
        <Text size="1" style={{ textAlign: 'center', padding: '6px 4px', borderRight: '2px solid var(--gray-7)', backgroundColor: 'var(--gray-1)', borderTop: '1px solid var(--gray-6)' }}>
          <Em>{selectedSegment.limitation_of_bi_as_per_morth_circular_in_mm_km?.toFixed(0) ?? 'N/A'}</Em>
        </Text>
        <DifferenceDisplay
          measured={selectedSegment.l1_lane_roughness_bi_in_mm_km}
          limit={selectedSegment.limitation_of_bi_as_per_morth_circular_in_mm_km}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.l2_lane_roughness_bi_in_mm_km}
          limit={selectedSegment.limitation_of_bi_as_per_morth_circular_in_mm_km}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.l3_lane_roughness_bi_in_mm_km}
          limit={selectedSegment.limitation_of_bi_as_per_morth_circular_in_mm_km}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.l4_lane_roughness_bi_in_mm_km}
          limit={selectedSegment.limitation_of_bi_as_per_morth_circular_in_mm_km}
          borderRight="2px solid var(--gray-7)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.left_avg_roughness_bi}
          limit={selectedSegment.limitation_of_bi_as_per_morth_circular_in_mm_km}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.right_avg_roughness_bi}
          limit={selectedSegment.limitation_of_bi_as_per_morth_circular_in_mm_km}
          borderRight="2px solid var(--gray-7)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r1_lane_roughness_bi_in_mm_km}
          limit={selectedSegment.limitation_of_bi_as_per_morth_circular_in_mm_km}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r2_lane_roughness_bi_in_mm_km}
          limit={selectedSegment.limitation_of_bi_as_per_morth_circular_in_mm_km}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r3_lane_roughness_bi_in_mm_km}
          limit={selectedSegment.limitation_of_bi_as_per_morth_circular_in_mm_km}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r4_lane_roughness_bi_in_mm_km}
          limit={selectedSegment.limitation_of_bi_as_per_morth_circular_in_mm_km}
          borderTop="1px solid var(--gray-6)"
        />

        {/* Rut Depth Row */}
        <Text size="1" weight="bold" style={{ textAlign: 'left', padding: '6px 8px', borderRight: '1px solid var(--gray-6)', backgroundColor: 'var(--gray-1)', borderTop: '1px solid var(--gray-6)' }}>
          Rut Depth<br />
          <span style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--gray-11)' }}>(mm)</span>
        </Text>
        <Text size="1" style={{ textAlign: 'center', padding: '6px 4px', borderRight: '2px solid var(--gray-7)', backgroundColor: 'var(--gray-1)', borderTop: '1px solid var(--gray-6)' }}>
          <Em>{selectedSegment.limitation_of_rut_depth_as_per_concession_agreement_in_mm?.toFixed(1) ?? 'N/A'}</Em>
        </Text>
        <DifferenceDisplay
          measured={selectedSegment.l1_rut_depth_in_mm}
          limit={selectedSegment.limitation_of_rut_depth_as_per_concession_agreement_in_mm}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.l2_rut_depth_in_mm}
          limit={selectedSegment.limitation_of_rut_depth_as_per_concession_agreement_in_mm}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.l3_rut_depth_in_mm}
          limit={selectedSegment.limitation_of_rut_depth_as_per_concession_agreement_in_mm}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.l4_rut_depth_in_mm}
          limit={selectedSegment.limitation_of_rut_depth_as_per_concession_agreement_in_mm}
          borderRight="2px solid var(--gray-7)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.left_avg_rut_depth}
          limit={selectedSegment.limitation_of_rut_depth_as_per_concession_agreement_in_mm}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.right_avg_rut_depth}
          limit={selectedSegment.limitation_of_rut_depth_as_per_concession_agreement_in_mm}
          borderRight="2px solid var(--gray-7)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r1_rut_depth_in_mm}
          limit={selectedSegment.limitation_of_rut_depth_as_per_concession_agreement_in_mm}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r2_rut_depth_in_mm}
          limit={selectedSegment.limitation_of_rut_depth_as_per_concession_agreement_in_mm}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r3_rut_depth_in_mm}
          limit={selectedSegment.limitation_of_rut_depth_as_per_concession_agreement_in_mm}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r4_rut_depth_in_mm}
          limit={selectedSegment.limitation_of_rut_depth_as_per_concession_agreement_in_mm}
          borderTop="1px solid var(--gray-6)"
        />

        {/* Crack Area Row */}
        <Text size="1" weight="bold" style={{ textAlign: 'left', padding: '6px 8px', borderRight: '1px solid var(--gray-6)', backgroundColor: 'var(--gray-1)', borderTop: '1px solid var(--gray-6)' }}>
          Crack Area<br />
          <span style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--gray-11)' }}>(area)</span>
        </Text>
        <Text size="1" style={{ textAlign: 'center', padding: '6px 4px', borderRight: '2px solid var(--gray-7)', backgroundColor: 'var(--gray-1)', borderTop: '1px solid var(--gray-6)' }}>
          <Em>{selectedSegment.limitation_of_cracking_as_per_concession_agreement_in_area?.toFixed(2) ?? 'N/A'}</Em>
        </Text>
        <DifferenceDisplay
          measured={selectedSegment.l1_crack_area_in_area}
          limit={selectedSegment.limitation_of_cracking_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.l2_crack_area_in_area}
          limit={selectedSegment.limitation_of_cracking_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.l3_crack_area_in_area}
          limit={selectedSegment.limitation_of_cracking_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.l4_crack_area_in_area}
          limit={selectedSegment.limitation_of_cracking_as_per_concession_agreement_in_area}
          borderRight="2px solid var(--gray-7)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.left_avg_crack_area}
          limit={selectedSegment.limitation_of_cracking_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.right_avg_crack_area}
          limit={selectedSegment.limitation_of_cracking_as_per_concession_agreement_in_area}
          borderRight="2px solid var(--gray-7)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r1_crack_area_in_area}
          limit={selectedSegment.limitation_of_cracking_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r2_crack_area_in_area}
          limit={selectedSegment.limitation_of_cracking_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r3_crack_area_in_area}
          limit={selectedSegment.limitation_of_cracking_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r4_crack_area_in_area}
          limit={selectedSegment.limitation_of_cracking_as_per_concession_agreement_in_area}
          borderTop="1px solid var(--gray-6)"
        />

        {/* Ravelling Area Row */}
        <Text size="1" weight="bold" style={{ textAlign: 'left', padding: '6px 8px', borderRight: '1px solid var(--gray-6)', backgroundColor: 'var(--gray-1)', borderTop: '1px solid var(--gray-6)' }}>
          Ravelling Area<br />
          <span style={{ fontSize: '9px', fontWeight: 'normal', color: 'var(--gray-11)' }}>(area)</span>
        </Text>
        <Text size="1" style={{ textAlign: 'center', padding: '6px 4px', borderRight: '2px solid var(--gray-7)', backgroundColor: 'var(--gray-1)', borderTop: '1px solid var(--gray-6)' }}>
          <Em>{selectedSegment.limitation_of_ravelling_as_per_concession_agreement_in_area?.toFixed(2) ?? 'N/A'}</Em>
        </Text>
        <DifferenceDisplay
          measured={selectedSegment.l1_area_area}
          limit={selectedSegment.limitation_of_ravelling_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.l2_area_area}
          limit={selectedSegment.limitation_of_ravelling_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.l3_area_area}
          limit={selectedSegment.limitation_of_ravelling_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.l4_area_area}
          limit={selectedSegment.limitation_of_ravelling_as_per_concession_agreement_in_area}
          borderRight="2px solid var(--gray-7)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.left_avg_ravelling_area}
          limit={selectedSegment.limitation_of_ravelling_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.right_avg_ravelling_area}
          limit={selectedSegment.limitation_of_ravelling_as_per_concession_agreement_in_area}
          borderRight="2px solid var(--gray-7)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r1_area_area}
          limit={selectedSegment.limitation_of_ravelling_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r2_area_area}
          limit={selectedSegment.limitation_of_ravelling_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r3_area_area}
          limit={selectedSegment.limitation_of_ravelling_as_per_concession_agreement_in_area}
          borderRight="1px solid var(--gray-6)"
          borderTop="1px solid var(--gray-6)"
        />
        <DifferenceDisplay
          measured={selectedSegment.r4_area_area}
          limit={selectedSegment.limitation_of_ravelling_as_per_concession_agreement_in_area}
          borderTop="1px solid var(--gray-6)"
        />
      </Box>
    </Box>
  );
};
