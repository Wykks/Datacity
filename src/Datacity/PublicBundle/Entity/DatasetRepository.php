<?php

namespace Datacity\PublicBundle\Entity;

use Doctrine\ORM\EntityRepository;

/**
 * DatasetRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class DatasetRepository extends EntityRepository
{
    private function addCategoriesByName(&$dataset, $categoriesNames)
    {
        $catRep = $this->getEntityManager()->getRepository('DatacityPublicBundle:Category');
        foreach ($categoriesNames as $cat) {
            $category = $catRep->findOneByName($cat);
            if (!$category)
                return $category;
            $dataset->addCategory($category);
        }
        return null;
    }

    // Retourne le nom de la catégorie si un nom est inconnu sinon null
	public function addUniqueCategoriesByName(&$dataset, $categoriesNames)
	{
		$currentCategories = $dataset->getCategories();
		//TODO Voir si une requete SQL est possible ici
        $cats = array_filter(
            $categoriesNames,
            function ($e) use (&$currentCategories) {
                foreach ($currentCategories as $cat) {
                    if ($cat->getName() === $e)
                        return false;
                }
                return true;
            }
        );
        return $this->addCategoriesByName($dataset, $cats);
	}

	public function setLowestFrequency(&$dataset, $freq)
	{
		$currentFreq = $dataset->getFrequency();
		if (!$currentFreq || $currentFreq->getLevel() > $freq->getLevel())
        	$dataset->setFrequency($freq);
	}

	public function setBiggestCoverageTerritory(&$dataset, $coverageTerritory)
	{
		$currentCoverage = $dataset->getCoverageTerritory();
		if (!$currentCoverage || $currentCoverage->getLevel() < $coverageTerritory->getLevel())
        	$dataset->setCoverageTerritory($coverageTerritory);
	}
}
